package com.itpm.website.websocket;

import com.itpm.website.dtos.user.Token;
import com.itpm.website.enities.User;
import com.itpm.website.repos.UserRepo;
import com.itpm.website.utils.JwtUtils;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

@Component
@RequiredArgsConstructor
public class SupportWebSocketAuthInterceptor implements HandshakeInterceptor {

    private final JwtUtils jwtUtils;
    private final UserRepo userRepo;

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes
    ) {
        if (!(request instanceof ServletServerHttpRequest servletRequest)) {
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }

        HttpServletRequest httpRequest = servletRequest.getServletRequest();
        String requestToken = resolveRequestToken(httpRequest);
        User user = authenticate(requestToken);

        if (user == null) {
            String cookieToken = jwtUtils.getTokenFromCookie(httpRequest, Token.ACCESS);
            if (cookieToken != null && !cookieToken.isBlank() && !cookieToken.equals(requestToken)) {
                user = authenticate(cookieToken);
            }
        }

        if (user == null) {
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }

        attributes.put("userId", user.getUserId());
        attributes.put("email", user.getEmail());
        attributes.put("role", user.getRole() != null ? user.getRole().name() : "");
        return true;
    }

    private String resolveRequestToken(HttpServletRequest httpRequest) {
        String authHeader = httpRequest.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }

        String queryToken = httpRequest.getParameter("accessToken");
        if (queryToken != null && !queryToken.isBlank()) {
            return queryToken;
        }

        return jwtUtils.getTokenFromCookie(httpRequest, Token.ACCESS);
    }

    private User authenticate(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }

        String email;
        try {
            email = jwtUtils.extractUsername(token);
        } catch (Exception ex) {
            return null;
        }

        User user = userRepo.findByEmail(email).orElse(null);
        if (user == null || !jwtUtils.validateToken(token, user)) {
            return null;
        }

        return user;
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception
    ) {
        // no-op
    }
}
