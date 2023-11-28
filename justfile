# TO USE JUSTFILE, INSTALL IT FIRST https://github.com/casey/just
# just is an alternative to make

lint:
	cargo fmt --all -- --check
	cargo clippy --features=test-bpf -- --allow clippy::result_large_err --allow clippy::await_holding_refcell_ref --allow clippy::comparison_chain --allow clippy::bind_instead_of_map
