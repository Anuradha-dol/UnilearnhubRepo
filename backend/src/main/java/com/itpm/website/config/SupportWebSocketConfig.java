package com.itpm.website.config;

import com.itpm.website.websocket.SupportWebSocketAuthInterceptor;
import com.itpm.website.websocket.SupportWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class SupportWebSocketConfig implements WebSocketConfigurer {

    private final SupportWebSocketHandler supportWebSocketHandler;
    private final SupportWebSocketAuthInterceptor supportWebSocketAuthInterceptor;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(supportWebSocketHandler, "/ws/support")
                .addInterceptors(supportWebSocketAuthInterceptor)
                .setAllowedOriginPatterns("*");
    }
}