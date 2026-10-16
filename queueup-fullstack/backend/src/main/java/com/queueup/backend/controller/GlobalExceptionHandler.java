package com.queueup.backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

// One JSON shape for every error from every controller:
// { "status": 400, "error": "Bad Request", "message": "...", "errors": { "field": "..." }, "path": "...", "timestamp": "..." }
// Extends ResponseEntityExceptionHandler so Spring's own MVC errors (404, 405, 415, bad JSON) use it too.
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    public record ErrorBody(int status, String error, String message, Map<String, String> errors,
                            String path, String timestamp) {}

    // Two staff changed the same customer at the same moment (@Version check failed)
    @ExceptionHandler(OptimisticLockingFailureException.class)
    public ResponseEntity<Object> handleOptimisticLock(OptimisticLockingFailureException ex, HttpServletRequest request) {
        return body(HttpStatus.CONFLICT, "Someone else just updated this customer. The queue has been refreshed; please try again.",
                null, request.getRequestURI());
    }

    // A unique constraint said no (for example the same token joined twice at the same instant)
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Object> handleConflict(DataIntegrityViolationException ex, HttpServletRequest request) {
        log.warn("Data conflict on {}: {}", request.getRequestURI(), ex.getMostSpecificCause().getMessage());
        return body(HttpStatus.CONFLICT, "That couldn't be saved because of a conflict. Please try again.",
                null, request.getRequestURI());
    }

    // Anything unexpected: log everything, tell the client nothing internal
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleUnexpected(Exception ex, HttpServletRequest request) {
        log.error("Unexpected error on {} {}", request.getMethod(), request.getRequestURI(), ex);
        return body(HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong on our side. Please try again.",
                null, request.getRequestURI());
    }

    // @Valid failures: one message per field
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex, HttpHeaders headers,
                                                                  HttpStatusCode status, WebRequest request) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(fe -> errors.putIfAbsent(fe.getField(), fe.getDefaultMessage()));
        String first = errors.isEmpty() ? "Please check the form." : errors.values().iterator().next();
        return body(HttpStatus.BAD_REQUEST, first, errors, path(request));
    }

    // Every other Spring MVC error and every ResponseStatusException from our services ends up here
    @Override
    protected ResponseEntity<Object> handleExceptionInternal(Exception ex, Object body, HttpHeaders headers,
                                                             HttpStatusCode statusCode, WebRequest request) {
        String message = (ex instanceof ResponseStatusException rse && rse.getReason() != null)
                ? rse.getReason()
                : defaultMessage(statusCode);
        ErrorBody errorBody = errorBody(statusCode, message, null, path(request));
        return ResponseEntity.status(statusCode).headers(headers).body(errorBody);
    }

    private ResponseEntity<Object> body(HttpStatus status, String message, Map<String, String> errors, String path) {
        return ResponseEntity.status(status).body(errorBody(status, message, errors, path));
    }

    private ErrorBody errorBody(HttpStatusCode status, String message, Map<String, String> errors, String path) {
        HttpStatus resolved = HttpStatus.resolve(status.value());
        String error = resolved != null ? resolved.getReasonPhrase() : "Error";
        return new ErrorBody(status.value(), error, message, errors, path, Instant.now().toString());
    }

    private String defaultMessage(HttpStatusCode status) {
        return switch (status.value()) {
            case 400 -> "The request couldn't be read. Please check what was sent.";
            case 404 -> "That doesn't exist.";
            case 405 -> "That action isn't allowed here.";
            case 415 -> "Please send JSON.";
            default -> "Something went wrong. Please try again.";
        };
    }

    private String path(WebRequest request) {
        return request instanceof ServletWebRequest swr ? swr.getRequest().getRequestURI() : "";
    }
}
