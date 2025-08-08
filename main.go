package main

import (
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
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	gqlgenerated "github.com/shiqi/datai/gql/generated"
	"github.com/shiqi/datai/gql/resolver"
	"github.com/shiqi/datai/internal/middleware"
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
	user := getEnv("DB_USER", "dataiuser")
	pass := getEnv("DB_PASSWORD", "dataipass")
	host := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")

	dbs := []string{"user_db", "events_db", "tenant_db"}

	for _, db := range dbs {
		dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable", user, pass, host, dbPort, db)
		waitForDB(dsn)
		runMigration(db, fmt.Sprintf("file://migrations/%s", db[0:len(db)-3]), dsn) // "user_db" -> "user"
	}

	// Authing
	port := getEnv("PORT", "8080")
	authMiddleware := middleware.NewAuthingMiddleware(
		getEnv("AUTHING_JWKS_URL", ""),
		getEnv("AUTHING_AUDIENCE", ""),
		getEnv("AUTHING_ISSUER", ""),
	)

	// Authing 构建 GraphQL 服务器
	srv := handler.NewDefaultServer(gqlgenerated.NewExecutableSchema(gqlgenerated.Config{Resolvers: &resolver.Resolver{}}))
	// Authing： 注入JWT中间件
	http.Handle("/", playground.Handler("GraphQL", "/query"))
	http.Handle("/query", authMiddleware.Middleware(srv))
	log.Printf("🚀 Server started at http://localhost:%s/", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
