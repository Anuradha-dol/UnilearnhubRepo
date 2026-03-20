package com.itpm.website.repos;

import com.itpm.website.enities.ForgotPassword;
import com.itpm.website.enities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ForgotPasswordRepository extends JpaRepository<ForgotPassword, Integer> {


    Optional<ForgotPassword> findByOtpAndUser(Integer otp, User user);


    Optional<ForgotPassword> findByUser(User user);
}
