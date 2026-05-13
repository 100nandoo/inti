.PHONY: build serve dev

build:
	go build -o inti .

serve:
	./inti serve

dev:
	@./scripts/dev.sh
