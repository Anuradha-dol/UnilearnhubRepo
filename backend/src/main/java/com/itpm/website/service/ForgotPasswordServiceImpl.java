package com.itpm.website.service;

import com.itpm.website.dtos.UserDto;
import com.itpm.website.dtos.user.MailBody;
import com.itpm.website.dtos.user.RecoveryChannel;
import com.itpm.website.dtos.user.Token;
import com.itpm.website.enities.ForgotPassword;
import com.itpm.website.enities.User;
import com.itpm.website.repos.ForgotPasswordRepository;
import com.itpm.website.repos.UserRepo;
import com.itpm.website.service.user.EmailService;
import com.itpm.website.utils.JwtUtils;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ForgotPasswordServiceImpl implements ForgotPasswordService {

    private final JwtUtils jwtUtils;
    private final UserRepo userRepo;
    private final EmailService emailService;
    private final ForgotPasswordRepository forgotPasswordRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public ResponseEntity<String> sendOtp(Map<String, String> request, HttpServletResponse response) {
        User user = findUserByIdentifiers(request);
        if (user == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("No matching user found.");

        ForgotPassword fp = prepareForgotPassword(user, request);

        sendOtpByChannel(user, fp);

        addEmailCookie(response, user.getEmail());

        return ResponseEntity.ok("OTP sent successfully.");
    }

    @Override
    public ResponseEntity<String> resendOtp(HttpServletRequest request, HttpServletResponse response) {
        String email = getEmailFromCookie(request);
        if (email == null) return ResponseEntity.badRequest().body("Email not found. Start forgot password process again.");

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Invalid email"));

        ForgotPassword fp = forgotPasswordRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("OTP not requested yet"));

        handleResendLimits(fp);

        int newOtp = generateOtp();
        fp.setOtp(newOtp);
        fp.setExpirationTime(new Date(System.currentTimeMillis() + 5 * 60 * 1000));
        forgotPasswordRepository.save(fp);

        sendOtpByChannel(user, fp);

        addEmailCookie(response, user.getEmail());

        return ResponseEntity.ok("OTP resent successfully (" + fp.getResendCount() + "/3)");
    }

    @Override
    public ResponseEntity<String> verifyOtp(Map<String, String> request, HttpServletRequest httpRequest, HttpServletResponse response) {
        String email = getEmailFromCookie(httpRequest);
        if (email == null) return ResponseEntity.badRequest().body("Email not found. Start forgot password process again.");

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Invalid email"));

        ForgotPassword fp = forgotPasswordRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("No OTP request found"));

        int otp = Integer.parseInt(request.get("otp"));
        if (!fp.getOtp().equals(otp)) return ResponseEntity.badRequest().body("Invalid OTP");
        if (fp.getExpirationTime().before(new Date())) {
            forgotPasswordRepository.delete(fp);
            return ResponseEntity.status(HttpStatus.EXPECTATION_FAILED).body("OTP expired");
        }

        jwtUtils.generateToken(Map.of(), user, response, Token.VERIFY);
        return ResponseEntity.ok("OTP verified successfully");
    }

    @Override
    public ResponseEntity<String> changePassword(HttpServletRequest request, HttpServletResponse response, UserDto.ChangePassword dto) {
        String token = jwtUtils.getTokenFromCookie(request, Token.VERIFY);
        if (token == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Reset token missing");

        String email = jwtUtils.extractUsername(token);
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Invalid token"));

        if (!dto.password().equals(dto.repeatPassword())) return ResponseEntity.badRequest().body("Passwords do not match");

        user.setPassword(passwordEncoder.encode(dto.password()));
        userRepo.save(user);

        forgotPasswordRepository.findByUser(user).ifPresent(forgotPasswordRepository::delete);
        jwtUtils.removeToken(response, Token.VERIFY);

        return ResponseEntity.ok("Password changed successfully");
    }

    // ===================== HELPER METHODS =====================
    private User findUserByIdentifiers(Map<String, String> request) {
        String email = request.get("email");
        String tempEmail = request.get("tempEmail");
        String phoneNumber = request.get("phoneNumber");

        int providedCount = 0;
        if (email != null && !email.isEmpty()) providedCount++;
        if (tempEmail != null && !tempEmail.isEmpty()) providedCount++;
        if (phoneNumber != null && !phoneNumber.isEmpty()) providedCount++;

        if (providedCount < 2) return null;

        return userRepo.findAll().stream()
                .filter(u -> {
                    int match = 0;
                    if (email != null && email.equals(u.getEmail())) match++;
                    if (tempEmail != null && tempEmail.equals(u.getTempEmail())) match++;
                    if (phoneNumber != null && phoneNumber.equals(u.getPhoneNumber())) match++;
                    return match >= 2;
                }).findFirst().orElse(null);
    }

    private ForgotPassword prepareForgotPassword(User user, Map<String, String> request) {
        int otp = generateOtp();
        Date expirationTime = new Date(System.currentTimeMillis() + 5 * 60 * 1000);

        ForgotPassword fp = forgotPasswordRepository.findByUser(user).orElse(new ForgotPassword());
        fp.setUser(user);
        fp.setOtp(otp);
        fp.setExpirationTime(expirationTime);
        fp.setLastSentAt(new Date());
        fp.setResendCount(0);
        fp.setFirstResendTime(null);
        fp.setBlockUntil(null);

        boolean emailVerified = request.get("email") != null && request.get("email").equals(user.getEmail());
        boolean tempEmailVerified = request.get("tempEmail") != null && request.get("tempEmail").equals(user.getTempEmail());
        boolean phoneVerified = request.get("phoneNumber") != null && request.get("phoneNumber").equals(user.getPhoneNumber());

        RecoveryChannel channel;
        if (emailVerified) channel = RecoveryChannel.EMAIL;
        else if (!emailVerified && tempEmailVerified) channel = RecoveryChannel.BACKUP_EMAIL;
        else channel = phoneVerified ? RecoveryChannel.PHONE : RecoveryChannel.EMAIL;

        fp.setRecoveryChannel(channel);
        forgotPasswordRepository.save(fp);

        return fp;
    }

    private void sendOtpByChannel(User user, ForgotPassword fp) {
        switch (fp.getRecoveryChannel()) {
            case EMAIL -> sendOtpEmail(user.getEmail(), fp.getOtp());
            case BACKUP_EMAIL -> sendOtpEmail(user.getTempEmail(), fp.getOtp());
            case PHONE -> sendOtpSms(user.getPhoneNumber(), fp.getOtp());
        }
    }

    private void handleResendLimits(ForgotPassword fp) {
        Date now = new Date();
        if (fp.getBlockUntil() != null && now.before(fp.getBlockUntil())) {
            throw new RuntimeException("Maximum resend attempts reached. Wait until block expires.");
        }
        if (fp.getFirstResendTime() == null || now.getTime() - fp.getFirstResendTime().getTime() > 60 * 1000) {
            fp.setFirstResendTime(now);
            fp.setResendCount(0);
        }
        fp.setResendCount(fp.getResendCount() == null ? 1 : fp.getResendCount() + 1);
        if (fp.getResendCount() > 3) {
            fp.setBlockUntil(new Date(now.getTime() + 30 * 60 * 1000));
            forgotPasswordRepository.save(fp);
            throw new RuntimeException("Maximum resend attempts reached. Blocked for 30 minutes.");
        }
    }

    private void addEmailCookie(HttpServletResponse response, String email) {
        Cookie emailCookie = new Cookie("forgotEmail", email);
        emailCookie.setHttpOnly(true);
        emailCookie.setMaxAge(10 * 60);
        emailCookie.setPath("/");
        response.addCookie(emailCookie);
    }

    private int generateOtp() {
        return new Random().nextInt(100_000, 999_999);
    }

    private void sendOtpEmail(String email, int otp) {
        emailService.sendSimpleMessasge(new MailBody(email, "OTP for Forgot Password",
                "Your OTP is: " + otp + " (valid for 5 minutes)"));
    }

    private void sendOtpSms(String phoneNumber, int otp) {
        System.out.println("Send OTP " + otp + " to phone " + phoneNumber);
    }

    private String getEmailFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        for (Cookie c : request.getCookies()) {
            if ("forgotEmail".equals(c.getName())) return c.getValue();
        }
        return null;
    }
}