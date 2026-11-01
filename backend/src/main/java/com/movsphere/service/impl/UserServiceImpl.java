package com.movsphere.service.impl;

import com.movsphere.dao.UserDao;
import com.movsphere.dto.AuthResponse;
import com.movsphere.dto.LoginRequest;
import com.movsphere.dto.RegisterRequest;
import com.movsphere.dto.UserProfileResponse;
import com.movsphere.entity.UserEntity;
import com.movsphere.entity.UserRole;
import com.movsphere.exception.DuplicateEmailException;
import com.movsphere.exception.InvalidCredentialsException;
import com.movsphere.repository.UserRepository;
import com.movsphere.security.JwtTokenProvider;
import com.movsphere.service.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserServiceImpl implements UserService {

    private final UserDao userDao;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public UserServiceImpl(UserDao userDao,
                           PasswordEncoder passwordEncoder,
                           JwtTokenProvider jwtTokenProvider) {
        this.userDao = userDao;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userDao.existsByEmail(request.getEmail())) {
            throw new DuplicateEmailException("Email is already registered.");
        }

        UserRole role;
        try {
            role = UserRole.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException ex) {
            role = UserRole.CUSTOMER;
        }

        UserEntity user = new UserEntity();
        user.setName(request.getName());
        user.setEmail(request.getEmail().toLowerCase());
        user.setPhone(request.getPhone());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);

        UserEntity savedUser = userDao.save(user);

        String token = jwtTokenProvider.generateToken(savedUser.getEmail(), savedUser.getRole());

        return new AuthResponse(token, savedUser.getId(), savedUser.getName(), savedUser.getEmail(), savedUser.getRole());
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        UserEntity user = userDao.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password.");
        }

        String token = jwtTokenProvider.generateToken(user.getEmail(), user.getRole());
        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail(), user.getRole());
    }

    @Override
    public UserProfileResponse getProfile(String email) {
        UserEntity user = userDao.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new InvalidCredentialsException("Authenticated user not found."));

        return new UserProfileResponse(user.getId(), user.getName(), user.getEmail(), user.getPhone(), user.getRole());
    }

    @Override
    public UserEntity findByEmail(String email) {
        return userDao.findByEmail(email.toLowerCase()).orElse(null);
    }
}
