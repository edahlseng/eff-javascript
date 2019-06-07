node_modules: package.json
	npm install
	touch node_modules/update-modified-timestamp.temp
	rm node_modules/update-modified-timestamp.temp

install: node_modules

dist: node_modules package.json sources
	npm run build

build: dist

test: dist package.json
	npm run test
