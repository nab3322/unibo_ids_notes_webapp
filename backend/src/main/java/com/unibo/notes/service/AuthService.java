package com.unibo.notes.service;

import com.unibo.notes.dto.auth.AuthResponse;
import com.unibo.notes.dto.auth.LoginRequest;
import com.unibo.notes.dto.auth.RegisterRequest;
import com.unibo.notes.entity.User;
import com.unibo.notes.exception.ConflictException;
import com.unibo.notes.exception.UnauthorizedException;
import com.unibo.notes.exception.ValidationException;
import com.unibo.notes.repository.UserRepository;
import com.unibo.notes.util.JWTUtil;
import com.unibo.notes.util.PasswordUtil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.Optional;

@ApplicationScoped
public class AuthService {

    @Inject
    UserRepository userRepository;

    @Inject
    PasswordUtil passwordUtil;

    @Inject
    JWTUtil jwtUtil;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Validazione
        if (request.username == null || request.username.trim().isEmpty()) {
            throw new ValidationException("Username is required");
        }
        if (request.email == null || request.email.trim().isEmpty()) {
            throw new ValidationException("Email is required");
        }
        if (request.password == null || request.password.length() < 6) {
            throw new ValidationException("Password must be at least 6 characters");
        }

        // Verifica duplicati
        if (userRepository.existsByUsername(request.username)) {
            throw new ConflictException("Username already exists");
        }
        if (userRepository.existsByEmail(request.email)) {
            throw new ConflictException("Email already exists");
        }

        // Crea nuovo utente
        User user = new User();
        user.username = request.username;
        user.email = request.email;
        user.passwordHash = passwordUtil.hashPassword(request.password);

        userRepository.persist(user);

        // Genera token
        String token = jwtUtil.generateToken(user.id, user.username);

        return new AuthResponse(token, user.username, user.email, user.id);
    }

    public AuthResponse login(LoginRequest request) {
        // Validazione
        if (request.username == null || request.username.trim().isEmpty()) {
            throw new ValidationException("Username or Email is required");
        }
        if (request.password == null || request.password.isEmpty()) {
            throw new ValidationException("Password is required");
        }
        Optional<User> userOptional = userRepository.findByUsername(request.username);
        if (userOptional.isEmpty()) {
            userOptional = userRepository.findByEmail(request.username);
        }
        User user = userOptional.orElseThrow(() -> new UnauthorizedException("Invalid username or password"));
        if (!passwordUtil.checkPassword(request.password, user.passwordHash)) {
            throw new UnauthorizedException("Invalid username or password");
        }
        String token = jwtUtil.generateToken(user.id, user.username);

        return new AuthResponse(token, user.username, user.email, user.id);
    }

    public AuthResponse refreshToken(User user) {
        String token = jwtUtil.generateToken(user.id, user.username);
        return new AuthResponse(token, user.username, user.email, user.id);
    }

    @Transactional
    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findByIdOptional(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        // Verifica password attuale
        if (!passwordUtil.checkPassword(currentPassword, user.passwordHash)) {
            throw new UnauthorizedException("Current password is incorrect");
        }

        // Valida nuova password
        if (newPassword == null || newPassword.length() < 6) {
            throw new ValidationException("New password must be at least 6 characters");
        }

        // Aggiorna password
        user.passwordHash = passwordUtil.hashPassword(newPassword);
        userRepository.persist(user);
    }
}