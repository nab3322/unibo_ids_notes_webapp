package com.unibo.notes.exception;

public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }

    public NotFoundException(String resource, Long id) {
        super(String.format("%s with id %d not found", resource, id));
    }
}