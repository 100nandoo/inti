package settings

import "github.com/100nandoo/inti/internal/appstate"

type TelegramSession = appstate.TelegramSession

type TelegramSessions struct {
	store *appstate.TelegramSessionStore
}

func NewTelegramSessions(store *appstate.TelegramSessionStore) *TelegramSessions {
	if store == nil {
		store = &appstate.TelegramSessionStore{}
	}
	return &TelegramSessions{store: store}
}

func (s *TelegramSessions) Get(chatID int64) (TelegramSession, bool) {
	return s.store.Get(chatID)
}

func (s *TelegramSessions) Save(session TelegramSession) error {
	return s.store.Save(session)
}

func (s *TelegramSessions) Delete(chatID int64) error {
	return s.store.Delete(chatID)
}

func (s *TelegramSessions) Authorized(chatID int64, keys *APIKeys) (TelegramSession, bool) {
	return s.store.Authorized(chatID, keys.store)
}

func (s *TelegramSessions) HasID(chatID int64) bool {
	return s.store.HasID(chatID)
}
