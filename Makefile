.PHONY: all setup clean lint test test-coverage build help release release/minor release/major

PROJECT_NAME := jsonlint
SRC_DIR := src
TEST_DIR := tests
BUILD_DIR := build
BIN_DIR := bin
SITE_DIR := site
VERSION_FILE := VERSION
BIN := node_modules/.bin

VERSION := $(shell cat $(VERSION_FILE))

SHELL := /bin/bash

# Default target
all: build

# ============================================================================
# Setup — install dependencies and git hooks
# ============================================================================
setup:
	@echo "Installing git hooks..."
	@bash git-hooks/setup.sh
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
# Lint — run strict linters on all file types
# ============================================================================
lint:
	@echo "Running typecheck..."
	bun x tsc --noEmit
	@echo "Running eslint..."
	bun $(BIN)/eslint $(SRC_DIR)
	@if find $(TEST_DIR) -name '*.ts' | grep -q .; then bun $(BIN)/eslint $(TEST_DIR); fi
	@echo "Running markdownlint..."
	bun $(BIN)/markdownlint '**/*.md' --ignore node_modules --ignore site --ignore build
	@echo "Running yamllint..."
	@find . -name '*.yml' -o -name '*.yaml' | grep -v node_modules | grep -v site/node_modules | xargs -r bun $(BIN)/yamllint
	@echo "Running jsonlint..."
	@find . -name '*.json' -not -path '*/node_modules/*' -not -path '*/build/*' -not -path '*/site/*' -not -name 'bun.lock' -not -name 'package-lock.json' -not -path '*/tests/fixtures/fails/*' | xargs -r bun run $(SRC_DIR)/bin.ts -q
	@echo "Running prettier check..."
	bun $(BIN)/prettier --check '$(SRC_DIR)/**/*.ts'
	@if find $(TEST_DIR) -name '*.ts' | grep -q .; then bun $(BIN)/prettier --check '$(TEST_DIR)/**/*.ts'; fi
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
# Build — compile TypeScript, create binary, pack npm package
# ============================================================================
build: clean
	@echo "Building $(PROJECT_NAME) v$(VERSION)..."
	bun build $(SRC_DIR)/index.ts --outdir $(BUILD_DIR) --target node --format esm
	bun x tsc --emitDeclarationOnly
	@echo "Building standalone binary..."
	bun build $(SRC_DIR)/bin.ts --compile --outfile $(BIN_DIR)/$(PROJECT_NAME)
	@echo "Packing npm package..."
	npm pack --dry-run
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
	@echo "  setup            Install dependencies and git hooks"
	@echo "  clean            Delete build artifacts"
	@echo "  lint             Run all linters (tsc, eslint, markdownlint, yamllint, jsonlint, prettier)"
	@echo "  test             Run all tests (unit, integration, e2e)"
	@echo "  test-coverage    Run tests with coverage report"
	@echo "  build            Build library, standalone binary, and verify npm pack"
	@echo "  release          Bump patch version, commit, and tag"
	@echo "  release/minor    Bump minor version, commit, and tag"
	@echo "  release/major    Bump major version, commit, and tag"
	@echo "  help             Show this help"
