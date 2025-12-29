package helper

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var jwtSecretKey []byte

func getJWTSecret() ([]byte, error) {
	if len(jwtSecretKey) == 0 {
		secret := os.Getenv("JWT_SECRET")
		if secret == "" {
			return nil, fmt.Errorf("JWT_SECRET environment variable not set")
		}
		jwtSecretKey = []byte(secret)
	}
	return jwtSecretKey, nil
}

type Claims struct {
	Email  string `json:"email"`
	UserID string `json:"id"`
	// add other fields like UserID if needed
	jwt.RegisteredClaims
}

func IsValidEmail(email string) bool {
	if strings.Contains(email, " ") {
		return false
	}
	if email != strings.ToLower(email) {
		return false
	}
	if !strings.Contains(email, "@") || !strings.HasSuffix(email, "@gmail.com") {
		return false
	}
	return true
}

func HashPassword(password string) (string, error) {
	pass, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(pass), err
}

func VerifyPassword(hashedPassword, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}

func GenerateJWT(email, userID string) (string, string, error) {
	secret, err := getJWTSecret()
	if err != nil {
		return "", "", err
	}

	accessExp := time.Now().Add(24 * time.Hour)
	refreshExp := time.Now().Add(7 * 24 * time.Hour)

	accessClaims := &Claims{
		Email:  email,
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(accessExp),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	refreshClaims := jwt.RegisteredClaims{
		ExpiresAt: jwt.NewNumericDate(refreshExp),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
	}

	access_token_jwt := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	refresh_token_jwt := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)

	access_token, err := access_token_jwt.SignedString(secret)
	if err != nil {
		return "", "", err
	}
	refresh_token, err := refresh_token_jwt.SignedString(secret)
	if err != nil {
		return "", "", err
	}
	return access_token, refresh_token, nil
}

func VerifyJWT(tokenString string) (*Claims, error) {
	secret, err := getJWTSecret()
	if err != nil {
		return nil, err
	}

	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return secret, nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}
	return claims, nil
}
