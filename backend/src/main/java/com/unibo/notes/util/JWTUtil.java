package com.unibo.notes.util;

import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Duration;
import java.util.HashSet;

@ApplicationScoped
public class JWTUtil {

    @ConfigProperty(name = "mp.jwt.verify.issuer", defaultValue = "https://notesapp.unibo.it")
    String issuer;

    public String generateToken(Long userId, String username) {
        return Jwt.issuer(issuer)
                .upn(userId.toString())
                .subject(userId.toString())
                .claim("username", username)
                .groups(new HashSet<>())
                .expiresIn(Duration.ofDays(7))
                .sign();
    }

    public String generateToken(Long userId, String username, long expirationDays) {
        return Jwt.issuer(issuer)
                .upn(userId.toString())
                .subject(userId.toString())
                .claim("username", username)
                .groups(new HashSet<>())
                .expiresIn(Duration.ofDays(expirationDays))
                .sign();
    }
}