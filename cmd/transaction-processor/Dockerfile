# Build stage
FROM golang:1.22-alpine AS builder

# Set Go toolchain to auto to allow upgrades
ENV GOTOOLCHAIN=auto

WORKDIR /app

# Install dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the Transaction Processor
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o transaction-processor ./cmd/transaction-processor

# Final stage
FROM alpine:latest

# Install ca-certificates for HTTPS requests
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /root/

# Copy the binary from builder stage
COPY --from=builder /app/transaction-processor .

# Run the binary
CMD ["./transaction-processor"]