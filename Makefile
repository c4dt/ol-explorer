build_serve: deps serve

deps:
	npm ci

serve:
	npx ng serve --disable-host-check --aot
