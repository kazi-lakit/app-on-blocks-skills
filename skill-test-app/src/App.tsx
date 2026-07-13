import { Route, Routes, Navigate } from "react-router-dom";
import { CallbackPage } from "./features/auth/callback-page";
import { ActivatePage } from "./features/auth/activate-page";
import { Layout } from "./features/layout/layout";
import { EventsListPage } from "./features/events/events-list-page";
import { EventDetailPage } from "./features/events/event-detail-page";
import { CreateEventPage } from "./features/events/create-event-page";
import { UpdateEventPage } from "./features/events/update-event-page";
import { MyTicketsPage } from "./features/tickets/my-tickets-page";
import "./App.css";

export default function App() {
  return (
    <Routes>
      <Route path="/callback" element={<CallbackPage />} />
      <Route path="/activate" element={<ActivatePage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<EventsListPage />} />
        <Route path="/events" element={<EventsListPage />} />
        <Route path="/events/new" element={<CreateEventPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/events/:id/edit" element={<UpdateEventPage />} />
        <Route path="/tickets" element={<MyTicketsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
