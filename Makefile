export SHELL := /bin/bash
export PATH  := node_modules/.bin:$(PATH)

ENTRY_FILE="./lib/rangebar.js"
DEPS := $(shell browserify --list $(ENTRY_FILE))
TEST_FILES = $(wildcard test/*.js)

all: dist/elessar.js
min: dist/elessar.min.js

dist/%.min.js: dist/%.js
	uglifyjs $< -o $@

dist/%.js: $(DEPS)
	mkdir -p $(@D)
	node brow.js $(ENTRY_FILE) $@

.PHONY: clean test coverage

clean:
	rm -rf dist

coverage: $(DEPS) $(TEST_FILES)
	browserify -t cssify -t coverify $(TEST_FILES) | tape-run | coverify | tap-spec

test: $(DEPS) $(TEST_FILES)
	browserify -t cssify $(TEST_FILES) | tape-run | tap-spec
