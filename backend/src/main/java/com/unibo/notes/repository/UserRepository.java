package com.unibo.notes.repository;

import com.unibo.notes.entity.User;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class UserRepository implements PanacheRepository<User> {

    public Optional<User> findByUsername(String username) {
        return find("username", username).firstResultOptional();
    }

    public Optional<User> findByEmail(String email) {
        return find("email", email).firstResultOptional();
    }

    public boolean existsByUsername(String username) {
        return count("username", username) > 0;
    }

    public boolean existsByEmail(String email) {
        return count("email", email) > 0;
    }

    public List<User> searchByUsername(String query, Long excludeUserId) {
        return find("lower(username) like lower(?1) and id != ?2", "%" + query + "%", excludeUserId)
                .page(0, 10)
                .list();
    }
}