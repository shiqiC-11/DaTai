package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	userdb "github.com/shiqi/datai/backend/db/user"
	gqlgenerated "github.com/shiqi/datai/backend/gql/generated"
	"github.com/shiqi/datai/backend/gql/resolver"
	"github.com/shiqi/datai/backend/internal/middleware"
	userpkg "github.com/shiqi/datai/backend/internal/user"
)

// 加载 .env 文件，找不到也不报错（用于生产环境用 shell 注入）
func loadEnv() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found. Using default environment vars.")
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func waitForDB(dsn string) {
	for {
		db, err := sql.Open("postgres", dsn)
		if err == nil {
			if err = db.Ping(); err == nil {
				log.Println("Connected to DB:", dsn)
				db.Close()
				return
			}
		}
		log.Println("Waiting for DB to be ready:", dsn)
		time.Sleep(2 * time.Second)
	}
}

func runMigration(name, path, dsn string) {
	log.Printf("🛠️  Migrating %s...", name)
	m, err := migrate.New(path, dsn)
	if err != nil {
		log.Fatalf("❌ Migration init failed for %s: %v", name, err)
	}
	err = m.Up()
	if err != nil && err.Error() != "no change" {
		log.Fatalf("❌ Migration failed for %s: %v", name, err)
	}
	log.Printf("✅ Migration complete for %s", name)
}

func main() {
	loadEnv()

	// 数据库
	dbUser := getEnv("DB_USER", "dataiuser")
	pass := getEnv("DB_PASSWORD", "dataipass")
	host := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")

	dbs := []string{"user_db", "events_db", "tenant_db"}

	for _, db := range dbs {
		dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable", dbUser, pass, host, dbPort, db)
		waitForDB(dsn)
		runMigration(db, fmt.Sprintf("file://migrations/%s", db[0:len(db)-3]), dsn) // "user_db" -> "user"
	}

	// 设置依赖注入
	// 连接用户数据库
	userDSN := fmt.Sprintf("postgres://%s:%s@%s:%s/user_db?sslmode=disable", dbUser, pass, host, dbPort)
	userPool, err := pgxpool.New(context.Background(), userDSN)
	if err != nil {
		log.Fatalf("Failed to connect to user database: %v", err)
	}
	defer userPool.Close()

	// 创建Repository （依赖数据库连接）
	userQueries := userdb.New(userPool)
	userRepo := userpkg.NewRepository(userQueries)

	// 创建Service
	userService := userpkg.NewService(userRepo)

	// 创建Resolver
	resolver := &resolver.Resolver{
		UserService: userService,
	}

	// Authing 中间件
	port := getEnv("PORT", "8080")
	authMiddleware := middleware.NewAuthingMiddleware(
		getEnv("AUTHING_JWKS_URL", "https://qiyu-datai.authing.cn/oidc/.well-known/jwks.json"), // JWKS URL
		getEnv("AUTHING_AUDIENCE", ""),                                 // Audience (暂时留空)
		getEnv("AUTHING_ISSUER", "https://qiyu-datai.authing.cn/oidc"), // Issuer (Authing 根域名，不带 /oidc)
		getEnv("AUTHING_SECRET", ""),                                   // Client Secret
	)

	// Authing 构建 GraphQL 服务器
	srv := handler.NewDefaultServer(gqlgenerated.NewExecutableSchema(gqlgenerated.Config{Resolvers: resolver}))
	// Authing： 注入JWT中间件
	http.Handle("/", playground.Handler("GraphQL", "/query"))
	http.Handle("/query", authMiddleware.Middleware(srv))
	log.Printf("🚀 Server started at http://localhost:%s/", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
