package com.movsphere.dao;

import com.movsphere.entity.UserEntity;

import java.util.Optional;

public interface UserDao {

    UserEntity save(UserEntity user);

    Optional<UserEntity> findByEmail(String email);

    Optional<UserEntity> findById(Long id);

    boolean existsByEmail(String email);
}
