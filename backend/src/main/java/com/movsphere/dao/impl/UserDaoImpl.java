package com.movsphere.dao.impl;

import com.movsphere.dao.UserDao;
import com.movsphere.entity.UserEntity;
import com.movsphere.repository.UserRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class UserDaoImpl implements UserDao {

    private final UserRepository userRepository;

    public UserDaoImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserEntity save(UserEntity user) {
        return userRepository.save(user);
    }

    @Override
    public Optional<UserEntity> findByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email);
    }

    @Override
    public Optional<UserEntity> findById(Long id) {
        return userRepository.findById(id);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmailIgnoreCase(email);
    }
}
