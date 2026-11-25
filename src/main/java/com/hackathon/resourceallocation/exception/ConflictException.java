package com.hackathon.resourceallocation.exception;

/** Request conflicts with the current resource state (HTTP 409). */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) { super(message); }
}
