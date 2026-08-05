; Custom NSIS include, picked up automatically by electron-builder
; (nsis.include defaults to build/installer.nsh).
;
; By default the licence page is "read this, then click I Agree" — the button
; itself is the consent, and there is nothing to tick. Defining
; MUI_LICENSEPAGE_CHECKBOX turns it into an explicit opt-in: a checkbox the user
; must select before the Next button becomes enabled, which is what an EULA
; acceptance should look like.
;
; These have to be defined before the licence page macro is inserted, which is
; why they live in an include rather than being set from package.json.

!define MUI_LICENSEPAGE_CHECKBOX
!define MUI_LICENSEPAGE_CHECKBOX_TEXT "I have read and accept the terms of this End User Licence Agreement."
