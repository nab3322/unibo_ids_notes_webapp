package com.unibo.notes.exception;

import jakarta.persistence.OptimisticLockException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import org.hibernate.StaleObjectStateException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Logger;

@Provider
public class GlobalExceptionHandler implements ExceptionMapper<Exception> {

    private static final Logger LOGGER = Logger.getLogger(GlobalExceptionHandler.class.getName());

    @Override
    public Response toResponse(Exception exception) {

        // ResourceNotFoundException -> 404
        if (exception instanceof ResourceNotFoundException) {
            return buildErrorResponse(
                    Response.Status.NOT_FOUND,
                    exception.getMessage(),
                    "RESOURCE_NOT_FOUND"
            );
        }

        // ConflictException -> 409
        if (exception instanceof ConflictException) {
            return buildErrorResponse(
                    Response.Status.CONFLICT,
                    exception.getMessage(),
                    "CONFLICT"
            );
        }

        // OptimisticLockException / StaleObjectStateException -> 409 (versione conflitto)
        if (exception instanceof OptimisticLockException ||
            exception instanceof StaleObjectStateException ||
            (exception.getCause() != null &&
             (exception.getCause() instanceof OptimisticLockException ||
              exception.getCause() instanceof StaleObjectStateException))) {
            return buildErrorResponse(
                    Response.Status.CONFLICT,
                    "La nota è stata modificata. Ricarica la pagina e riprova.",
                    "VERSION_CONFLICT"
            );
        }

        // UnauthorizedException -> 401
        if (exception instanceof UnauthorizedException) {
            return buildErrorResponse(
                    Response.Status.UNAUTHORIZED,
                    exception.getMessage(),
                    "UNAUTHORIZED"
            );
        }

        // ValidationException -> 400
        if (exception instanceof ValidationException) {
            return buildErrorResponse(
                    Response.Status.BAD_REQUEST,
                    exception.getMessage(),
                    "VALIDATION_ERROR"
            );
        }

        // Generic Exception -> 500 (LOG IL VERO ERRORE!)
        LOGGER.severe("========== UNHANDLED EXCEPTION ==========");
        LOGGER.severe("Message: " + exception.getMessage());
        LOGGER.severe("Type: " + exception.getClass().getName());
        exception.printStackTrace();
        LOGGER.severe("=========================================");

        return buildErrorResponse(
                Response.Status.INTERNAL_SERVER_ERROR,
                exception.getMessage(),
                "INTERNAL_SERVER_ERROR"
        );
    }

    private Response buildErrorResponse(Response.Status status, String message, String errorCode) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now().toString());
        errorResponse.put("status", status.getStatusCode());
        errorResponse.put("error", status.getReasonPhrase());
        errorResponse.put("message", message);
        errorResponse.put("errorCode", errorCode);

        return Response.status(status)
                .entity(errorResponse)
                .build();
    }
}