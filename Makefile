node_modules: package.json
	npm install
	touch node_modules/update-modified-timestamp.temp
	rm node_modules/update-modified-timestamp.temp

install: node_modules

dist: node_modules package.json sources
	npm run build

build: dist

test: package.json
	npm run test

test-report: dist package.json
	npm run test-report

validate:
	npm run validate
