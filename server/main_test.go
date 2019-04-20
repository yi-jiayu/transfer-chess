package main

import (
	"reflect"
	"testing"
)

func Test_duplicate(t *testing.T) {
	board := [][]string{
		{"1", "2"},
		{"3", "4"},
	}
	var dup [][]string
	t.Run("duplicates position", func(t *testing.T) {
		dup = duplicate(board)
		if !reflect.DeepEqual(board, dup) {
			t.Fail()
		}
	})
	t.Run("should not modify original", func(t *testing.T) {
		dup[0][0] = "5"
		if board[0][0] != "1" {
			t.Fail()
		}
	})
}
