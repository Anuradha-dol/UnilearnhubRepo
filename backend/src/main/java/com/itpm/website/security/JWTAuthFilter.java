package com.itpm.website.security;

import com.itpm.website.dtos.user.Token;
import com.itpm.website.utils.JwtUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Slf4j
public class JWTAuthFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String headerToken = getHeaderToken(request);
        String cookieToken = jwtUtils.getTokenFromCookie(request, Token.ACCESS);

        if ((headerToken == null || headerToken.isBlank()) && (cookieToken == null || cookieToken.isBlank())) {
            filterChain.doFilter(request, response);
            return;
        }

        boolean authenticated = tryAuthenticate(cookieToken, request);
        if (!authenticated && headerToken != null && !headerToken.isBlank() && !headerToken.equals(cookieToken)) {
            authenticated = tryAuthenticate(headerToken, request);
            if (authenticated) {
                log.debug("Authenticated user from bearer token after access cookie failed");
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getHeaderToken(HttpServletRequest request) {
        final String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }

    private boolean tryAuthenticate(String token, HttpServletRequest request) {
        if (token == null || token.isBlank() || SecurityContextHolder.getContext().getAuthentication() != null) {
            return SecurityContextHolder.getContext().getAuthentication() != null;
        }

        String userEmail = extractUsername(token);
        if (userEmail == null) {
            return false;
        }

        UserDetails userDetails;
        try {
            userDetails = userDetailsService.loadUserByUsername(userEmail);
        } catch (Exception e) {
            log.warn("User not found for JWT: {}", userEmail);
            return false;
        }

        if (!jwtUtils.validateToken(token, userDetails)) {
            log.warn("JWT validation failed for user: {}", userEmail);
            return false;
        }

        UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authToken);
        log.debug("JWT authenticated user: {}", userEmail);
        return true;
    }

    private String extractUsername(String token) {
        try {
            return jwtUtils.extractUsername(token);
        } catch (Exception e) {
            log.warn("JWT parsing failed: {}", e.getMessage());
            return null;
        }
    }
}

