package main

import (
	"banking-system/internal/models"
	"fmt"

	"github.com/google/uuid"
)

func main() {
	// Test that imports are working
	account := &models.Account{
		ID:       uuid.New(),
		Name:     "Test Account",
		Balance:  100000, // $1000.00 in cents
		Currency: "USD",
	}
	
	fmt.Printf("Successfully created account: %+v\n", account)
	fmt.Println("All Go modules are working correctly!")
}