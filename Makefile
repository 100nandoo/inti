.PHONY: build serve dev

build:
	go build -o inti .

serve:
	./inti serve

dev:
	@AIR_BIN="$$(command -v air || true)"; \
	if [ -z "$$AIR_BIN" ]; then \
		GOBIN_DIR="$$(go env GOBIN 2>/dev/null)"; \
		GOPATH_DIR="$$(go env GOPATH 2>/dev/null)"; \
		if [ -n "$$GOBIN_DIR" ] && [ -x "$$GOBIN_DIR/air" ]; then \
			AIR_BIN="$$GOBIN_DIR/air"; \
		elif [ -x "$$GOPATH_DIR/bin/air" ]; then \
			AIR_BIN="$$GOPATH_DIR/bin/air"; \
		else \
			echo "air is not installed"; \
			echo "install it with: go install github.com/air-verse/air@latest"; \
			exit 1; \
		fi; \
	fi; \
	"$$AIR_BIN"
