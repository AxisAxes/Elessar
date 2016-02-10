export SHELL := /bin/bash
export PATH  := $(shell npm bin):$(PATH)

ENTRY_FILE="./lib/rangebar.js"
DEPS := $(shell node_modules/.bin/browserify --list $(ENTRY_FILE))
TEST_FILES = $(filter-out test/utils.js, $(wildcard test/*.js))

all: dist/elessar.js
min: dist/elessar.min.js

dist/%.min.js: dist/%.js
	uglifyjs $< -o $@

dist/%.js: $(DEPS)
	mkdir -p $(@D)
	browserify -t browserify-global-shim $(ENTRY_FILE) -o $@

.PHONY: clean test coverage release

clean:
	rm -rf dist

test-local: $(DEPS) $(TEST_FILES)
	zuul --phantom -- $(TEST_FILES) | tap-spec

test: $(DEPS) $(TEST_FILES)
	zuul -- $(TEST_FILES) | tap-spec

tag: dist/elessar.js dist/elessar.min.js
	$(eval OLD_VERSION := $(shell git describe master --abbrev=0))
	$(eval VERSION := $(shell node_modules/.bin/semver $(OLD_VERSION) -i $(v)))
	tin -v $(VERSION)
	git commit -am $(VERSION)
	git tag $(VERSION)

release:
	git pull
	git push origin {develop,master}
	git push --tags
	git checkout `git describe master --abbrev=0`
	npm publ
	git checkout -
