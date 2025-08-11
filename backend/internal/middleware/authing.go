package middleware

import (
	"context"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// 解析 Authorization: Bearer <token> 头部
// 验证这个 token 是不是 Authing 签发的
// 提取其中的 sub 或 userId
// 注入到 context.Context，供后续 GraphQL 使用

type contextKey string

const userIdKey contextKey = "authing_user_id"

func GetUserIDFromContext(ctx context.Context) (string, error) {
	val := ctx.Value(userIdKey)
	if id, ok := val.(string); ok {
		return id, nil
	}
	return "", errors.New("authing user id not found in context")
}

type AuthingMiddleware struct {
	JWKSURL      string // Authing 的公钥地址，例如：https://<your-authing-domain>/.well-known/jwks.json
	Audience     string // 你在 Authing 设置的 API Identifier
	Issuer       string // Authing 的签发者，例如：https://<your-authing-domain>/
	ClientSecret string // Authing 的客户端密钥，用于 HS256 算法

	// 缓存相关
	keysCache  map[string]interface{} // 支持 RSA 公钥和 HMAC 密钥
	cacheMutex sync.RWMutex
	lastFetch  time.Time
	cacheTTL   time.Duration
}

// JWKS 结构
type JWKS struct {
	Keys []JWK `json:"keys"`
}

type JWK struct {
	Kid string `json:"kid"`
	Kty string `json:"kty"`
	Alg string `json:"alg"`
	Use string `json:"use"`
	N   string `json:"n"`
	E   string `json:"e"`
}

func NewAuthingMiddleware(jwksURL, audience, issuer, clientSecret string) *AuthingMiddleware {
	return &AuthingMiddleware{
		JWKSURL:      jwksURL,
		Audience:     audience,
		Issuer:       issuer,
		ClientSecret: clientSecret,
		keysCache:    make(map[string]interface{}),
		cacheTTL:     1 * time.Hour, // 缓存1小时
	}
}

func (a *AuthingMiddleware) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 添加请求日志
		log.Printf("🔐 Authing 中间件收到请求: %s %s", r.Method, r.URL.Path)

		// 提取 Bearer Token
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			log.Printf("❌ 缺少或无效的 Authorization 头部")
			http.Error(w, "missing or invalid Authorization header", http.StatusUnauthorized)
			return
		}
		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		log.Printf("📝 提取到 Token: %s...", tokenStr[:50])

		// 解析JWT获取kid和算法
		log.Printf("🔍 开始解析 JWT 获取 kid 和算法...")

		// 手动解析 JWT header 部分来获取 kid 和算法，避免签名验证
		parts := strings.Split(tokenStr, ".")
		if len(parts) != 3 {
			log.Printf("❌ JWT 格式错误：应该包含3个部分")
			http.Error(w, "invalid token format", http.StatusUnauthorized)
			return
		}

		// 解码 header 部分
		headerBytes, err := base64.RawURLEncoding.DecodeString(parts[0])
		if err != nil {
			log.Printf("❌ JWT header 解码失败: %v", err)
			http.Error(w, "invalid token format", http.StatusUnauthorized)
			return
		}

		var header map[string]interface{}
		if err := json.Unmarshal(headerBytes, &header); err != nil {
			log.Printf("❌ JWT header 解析失败: %v", err)
			http.Error(w, "invalid token format", http.StatusUnauthorized)
			return
		}

		log.Printf("✅ JWT header 解析成功")

		// 获取算法
		alg, ok := header["alg"].(string)
		if !ok {
			log.Printf("❌ 算法未在 token header 中找到")
			http.Error(w, "algorithm not found in token header", http.StatusUnauthorized)
			return
		}
		log.Printf("🔍 找到算法: %s", alg)

		// 获取kid（可能不存在）
		kid, hasKid := header["kid"].(string)
		if !hasKid {
			log.Printf("⚠️ kid 未在 token header 中找到，将使用默认密钥")
		} else {
			log.Printf("🔑 找到 kid: %s", kid)
		}

		// 获取对应的密钥
		var signingKey interface{}
		if hasKid {
			signingKey, err = a.getSigningKey(kid)
			if err != nil {
				log.Printf("❌ 获取密钥失败: %v", err)
				http.Error(w, "failed to get signing key", http.StatusUnauthorized)
				return
			}
		} else {
			// 对于没有 kid 的 token，尝试获取默认密钥
			signingKey, err = a.getDefaultSigningKey(alg)
			if err != nil {
				log.Printf("❌ 获取默认密钥失败: %v", err)
				http.Error(w, "failed to get default signing key", http.StatusUnauthorized)
				return
			}
		}
		log.Printf("✅ 获取密钥成功")

		// 验证token
		log.Printf("🔐 开始验证 token...")
		validatedToken, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
			log.Printf("🔍 验证 token 算法: %s", token.Method.Alg())
			if token.Method.Alg() != "RS256" && token.Method.Alg() != "HS256" {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Method.Alg())
			}
			return signingKey, nil
		})
		if err != nil || !validatedToken.Valid {
			log.Printf("❌ 验证 token 失败: %v", err)
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}
		log.Printf("✅ Token 验证成功")

		// 验证claims
		claims, ok := validatedToken.Claims.(jwt.MapClaims)
		if !ok {
			log.Printf("❌ 无效的 token claims")
			http.Error(w, "invalid token claims", http.StatusUnauthorized)
			return
		}
		log.Printf("✅ Claims 验证成功")

		// 验证audience
		if a.Audience != "" {
			if aud, ok := claims["aud"].(string); !ok || aud != a.Audience {
				log.Printf("❌ 无效的 audience: %s (期望: %s)", aud, a.Audience)
				http.Error(w, "invalid audience", http.StatusUnauthorized)
				return
			}
			log.Printf("✅ Audience 验证成功")
		}

		// 验证issuer
		if a.Issuer != "" {
			if iss, ok := claims["iss"].(string); !ok || iss != a.Issuer {
				log.Printf("❌ 无效的 issuer: %s (期望: %s)", iss, a.Issuer)
				http.Error(w, "invalid issuer", http.StatusUnauthorized)
				return
			}
			log.Printf("✅ Issuer 验证成功")
		}

		// 验证过期时间
		if exp, ok := claims["exp"].(float64); ok {
			if time.Now().Unix() > int64(exp) {
				log.Printf("❌ Token 已过期")
				http.Error(w, "token expired", http.StatusUnauthorized)
				return
			}
			log.Printf("✅ 过期时间验证成功")
		}

		// 提取用户 ID（sub 或自定义字段）
		userID, ok := claims["sub"].(string)
		if !ok || userID == "" {
			log.Printf("❌ 用户 ID (sub) 未在 token 中找到")
			http.Error(w, "user ID not found in token", http.StatusUnauthorized)
			return
		}
		log.Printf("👤 提取用户 ID: %s", userID)

		// 注入到 context
		ctx := context.WithValue(r.Context(), userIdKey, userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (a *AuthingMiddleware) getSigningKey(kid string) (interface{}, error) {
	// 先从缓存获取
	a.cacheMutex.RLock()
	if key, exists := a.keysCache[kid]; exists {
		a.cacheMutex.RUnlock()
		return key, nil
	}
	a.cacheMutex.RUnlock()

	// 检查是否需要刷新缓存
	a.cacheMutex.Lock()
	defer a.cacheMutex.Unlock()

	if time.Since(a.lastFetch) > a.cacheTTL {
		// 刷新缓存
		if err := a.refreshKeysCache(); err != nil {
			return nil, err
		}
	}

	// 再次从缓存获取
	if key, exists := a.keysCache[kid]; exists {
		return key, nil
	}

	return nil, fmt.Errorf("key not found: %s", kid)
}

func (a *AuthingMiddleware) refreshKeysCache() error {
	// 获取JWKS
	resp, err := http.Get(a.JWKSURL)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var jwks JWKS
	if err := json.NewDecoder(resp.Body).Decode(&jwks); err != nil {
		return err
	}

	// 清空旧缓存
	a.keysCache = make(map[string]interface{})

	// 转换并缓存所有key
	for _, key := range jwks.Keys {
		if key.Kty == "RSA" && key.Use == "sig" {
			rsaKey, err := jwkToRSAPublicKey(key)
			if err != nil {
				continue // 跳过无效的key
			}
			a.keysCache[key.Kid] = rsaKey
		}
	}

	a.lastFetch = time.Now()
	return nil
}

func (a *AuthingMiddleware) getDefaultSigningKey(alg string) (interface{}, error) {
	// 对于 HS256 算法，使用 client_secret 作为对称密钥
	if alg == "HS256" {
		if a.ClientSecret == "" {
			return nil, fmt.Errorf("HS256 algorithm requires client_secret to be configured")
		}
		log.Printf("🔑 使用 client_secret 作为 HS256 签名密钥")
		return []byte(a.ClientSecret), nil
	}

	// 对于其他算法，尝试获取第一个可用的密钥
	a.cacheMutex.RLock()
	defer a.cacheMutex.RUnlock()

	for _, key := range a.keysCache {
		return key, nil
	}

	return nil, fmt.Errorf("no signing keys available")
}

func jwkToRSAPublicKey(jwk JWK) (*rsa.PublicKey, error) {
	// 解码N和E
	nBytes, err := base64.RawURLEncoding.DecodeString(jwk.N)
	if err != nil {
		return nil, fmt.Errorf("failed to decode N: %w", err)
	}

	eBytes, err := base64.RawURLEncoding.DecodeString(jwk.E)
	if err != nil {
		return nil, fmt.Errorf("failed to decode E: %w", err)
	}

	// 转换为big.Int
	n := new(big.Int).SetBytes(nBytes)
	e := new(big.Int).SetBytes(eBytes)

	// 创建RSA公钥
	publicKey := &rsa.PublicKey{
		N: n,
		E: int(e.Int64()),
	}

	return publicKey, nil
}
