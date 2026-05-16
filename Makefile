.PHONY: all setup clean lint test e2e build help release release/minor release/major

PROJECT_NAME := jsonlint
SRC_DIR := src
TEST_DIR := tests
BUILD_DIR := build
BIN_DIR := bin
VERSION_FILE := VERSION

VERSION := $(shell cat $(VERSION_FILE))

SHELL := /bin/bash

# Default target
all: build

# ============================================================================
# Setup — install dependencies
# ============================================================================
setup:
	@echo "Installing dependencies..."
	bun install
	@echo "Setup complete."

# ============================================================================
# Clean — remove build artifacts
# ============================================================================
clean:
	@echo "Cleaning..."
	rm -rf $(BUILD_DIR) $(BIN_DIR)
	mkdir -p $(BUILD_DIR) $(BIN_DIR)
	@echo "Clean complete."

# ============================================================================
# Lint — run type checking and format checks
# ============================================================================
lint:
	@echo "Running typecheck..."
	bun x tsc --noEmit
	@echo "Lint passed."

# ============================================================================
# Test — run all tests
# ============================================================================
test:
	@echo "Running unit tests..."
	bun test $(TEST_DIR)/unit
	@echo "Running integration tests..."
	bun test $(TEST_DIR)/integration
	@echo "Running e2e tests..."
	bun test $(TEST_DIR)/e2e
	@echo "All tests passed."

# ============================================================================
# Test with coverage
# ============================================================================
test-coverage:
	@echo "Running tests with coverage..."
	bun test --coverage --coverage-reporter=text --coverage-reporter=lcov $(TEST_DIR)/unit $(TEST_DIR)/integration $(TEST_DIR)/e2e
	@echo "Coverage report generated."

# ============================================================================
# Build — compile TypeScript and create binary
# ============================================================================
build: clean
	@echo "Building $(PROJECT_NAME) v$(VERSION)..."
	bun build $(SRC_DIR)/index.ts --outdir $(BUILD_DIR) --target node --format esm
	bun x tsc --emitDeclarationOnly
	@echo "Building standalone binary..."
	bun build $(SRC_DIR)/bin.ts --compile --outfile $(BIN_DIR)/$(PROJECT_NAME)
	@echo "Build complete."

# ============================================================================
# Release — version management
# ============================================================================
define bump_version
	@CURRENT=$$(cat $(VERSION_FILE)); \
	IFS='.' read -r MAJOR MINOR PATCH <<< "$$CURRENT"; \
	$(1); \
	NEW="$$MAJOR.$$MINOR.$$PATCH"; \
	echo "$$NEW" > $(VERSION_FILE); \
	sed -i "s/\"version\": \".*\"/\"version\": \"$$NEW\"/" package.json; \
	echo "export const VERSION = \"$$NEW\";" > $(SRC_DIR)/version.ts; \
	git add $(VERSION_FILE) package.json $(SRC_DIR)/version.ts; \
	git commit -m "chore: release v$$NEW"; \
	git tag "v$$NEW"; \
	echo "Released v$$NEW"
endef

release:
	$(call bump_version,PATCH=$$((PATCH + 1)))

release/minor:
	$(call bump_version,MINOR=$$((MINOR + 1)); PATCH=0)

release/major:
	$(call bump_version,MAJOR=$$((MAJOR + 1)); MINOR=0; PATCH=0)

# ============================================================================
# Help
# ============================================================================
help:
	@echo "$(PROJECT_NAME) Makefile"
	@echo ""
	@echo "Targets:"
	@echo "  all (default)    Build the project"
	@echo "  setup            Install dependencies"
	@echo "  clean            Delete build artifacts"
	@echo "  lint             Run type checker"
	@echo "  test             Run all tests (unit, integration, e2e)"
	@echo "  test-coverage    Run tests with coverage report"
	@echo "  build            Build library and standalone binary"
	@echo "  release          Bump patch version, commit, and tag"
	@echo "  release/minor    Bump minor version, commit, and tag"
	@echo "  release/major    Bump major version, commit, and tag"
	@echo "  help             Show this help"
