package com.movsphere.service;

import com.movsphere.dto.AuthResponse;
import com.movsphere.dto.LoginRequest;
import com.movsphere.dto.RegisterRequest;
import com.movsphere.dto.UserProfileResponse;
import com.movsphere.entity.UserEntity;

public interface UserService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    UserProfileResponse getProfile(String email);

    UserEntity findByEmail(String email);
}
