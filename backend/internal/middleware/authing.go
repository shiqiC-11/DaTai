package middleware

import (
	"context"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
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
	JWKSURL  string // Authing 的公钥地址，例如：https://<your-authing-domain>/.well-known/jwks.json
	Audience string // 你在 Authing 设置的 API Identifier
	Issuer   string // Authing 的签发者，例如：https://<your-authing-domain>/

	// 缓存相关
	keysCache  map[string]*rsa.PublicKey
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

func NewAuthingMiddleware(jwksURL, audience, issuer string) *AuthingMiddleware {
	return &AuthingMiddleware{
		JWKSURL:   jwksURL,
		Audience:  audience,
		Issuer:    issuer,
		keysCache: make(map[string]*rsa.PublicKey),
		cacheTTL:  1 * time.Hour, // 缓存1小时
	}
}

func (a *AuthingMiddleware) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 提取 Bearer Token
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "missing or invalid Authorization header", http.StatusUnauthorized)
			return
		}
		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

		// 解析JWT获取kid
		token, err := jwt.Parse(tokenStr, nil)
		if err != nil {
			http.Error(w, "invalid token format", http.StatusUnauthorized)
			return
		}

		// 获取kid
		kid, ok := token.Header["kid"].(string)
		if !ok {
			http.Error(w, "kid not found in token header", http.StatusUnauthorized)
			return
		}

		// 获取对应的公钥
		publicKey, err := a.getPublicKey(kid)
		if err != nil {
			http.Error(w, "failed to get public key", http.StatusUnauthorized)
			return
		}

		// 验证token
		token, err = jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
			if token.Method.Alg() != "RS256" {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Method.Alg())
			}
			return publicKey, nil
		})
		if err != nil || !token.Valid {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		// 验证claims
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			http.Error(w, "invalid token claims", http.StatusUnauthorized)
			return
		}

		// 验证audience
		if a.Audience != "" {
			if aud, ok := claims["aud"].(string); !ok || aud != a.Audience {
				http.Error(w, "invalid audience", http.StatusUnauthorized)
				return
			}
		}

		// 验证issuer
		if a.Issuer != "" {
			if iss, ok := claims["iss"].(string); !ok || iss != a.Issuer {
				http.Error(w, "invalid issuer", http.StatusUnauthorized)
				return
			}
		}

		// 验证过期时间
		if exp, ok := claims["exp"].(float64); ok {
			if time.Now().Unix() > int64(exp) {
				http.Error(w, "token expired", http.StatusUnauthorized)
				return
			}
		}

		// 提取用户 ID（sub 或自定义字段）
		userID, ok := claims["sub"].(string)
		if !ok || userID == "" {
			http.Error(w, "user ID not found in token", http.StatusUnauthorized)
			return
		}

		// 注入到 context
		ctx := context.WithValue(r.Context(), userIdKey, userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (a *AuthingMiddleware) getPublicKey(kid string) (*rsa.PublicKey, error) {
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
	a.keysCache = make(map[string]*rsa.PublicKey)

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
