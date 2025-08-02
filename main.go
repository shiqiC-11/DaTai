package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
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

	user := getEnv("DB_USER", "dataiuser")
	pass := getEnv("DB_PASSWORD", "dataipass")
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")

	dbs := []string{"user_db", "events_db", "tenant_db"}

	for _, db := range dbs {
		dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable", user, pass, host, port, db)
		waitForDB(dsn)
		runMigration(db, fmt.Sprintf("file://migrations/%s", db[0:len(db)-3]), dsn) // "user_db" -> "user"
	}
}
