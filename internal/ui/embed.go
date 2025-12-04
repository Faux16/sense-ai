package ui

import (
	"embed"
	"io/fs"
	"net/http"
)

//go:embed dashboard/*
var dashboardFS embed.FS

func GetFileSystem() http.FileSystem {
	fsys, err := fs.Sub(dashboardFS, "dashboard")
	if err != nil {
		panic(err)
	}
	return http.FS(fsys)
}
