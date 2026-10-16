package com.queueup.backend;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

// Unit tests: no database, no Spring. Mockito fakes the repositories.
@ExtendWith(MockitoExtension.class)
class QueueServiceTest {

    @Mock CustomerRepository customers;
    @Mock ShopRepository shops;
    @Mock UserRepository users;
    @InjectMocks QueueService service;

    private final Shop shop = new Shop("ABC Barber", "", "abc-barber");

    @Test
    void joinRejectsOneLetterName() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.join(shop, new JoinRequest("A", "", "Haircut")));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        verify(customers, never()).save(any());
    }

    @Test
    void leaveWithWrongTicketKeyIsRefused() {
        Customer sita = new Customer("1", "Sita", "", "Haircut", "waiting", 0L);
        sita.setTicketKey("the-real-key");
        when(customers.findByShopAndTokenAndStatusIn(eq(shop), eq("1"), anyCollection())).thenReturn(Optional.of(sita));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.leave(shop, "1", "someone-elses-guess"));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        assertEquals("waiting", sita.getStatus());   // nothing changed
        verify(customers, never()).save(any());
    }

    @Test
    void serveMarksServedAndRecordsFinishTime() {
        Customer sita = new Customer("1", "Sita", "", "Haircut", "serving", 0L);
        User staff = new User();
        when(customers.findByShopAndTokenAndStatusIn(eq(shop), eq("1"), anyCollection())).thenReturn(Optional.of(sita));
        when(customers.findByShopAndStatusInOrderByQueueOrderAsc(eq(shop), anyCollection())).thenReturn(List.of());
        when(customers.findTopByShopOrderByIdDesc(shop)).thenReturn(Optional.of(sita));

        service.serve(shop, "1", staff);

        assertEquals("served", sita.getStatus());
        assertNotNull(sita.getFinishedAt());
        verify(customers).save(sita);
    }
}
