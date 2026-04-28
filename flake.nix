{
  description = "Studio City PWA game development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            bun
            gh
            git
            jdk21
          ];

          shellHook = ''
            echo "Studio City development shell"
            echo "bun: $(bun --version)"
            echo "gh: $(gh --version | head -n 1)"
            echo "git: $(git --version)"
            echo "java: $(java -version 2>&1 | head -n 1)"
          '';
        };
      }
    );
}
