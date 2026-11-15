-- "Verify location" submissions from the mural detail page (verifying the image reuses photos_same / photos_repainted).
alter table submissions drop constraint if exists submissions_kind_check;
alter table submissions add constraint submissions_kind_check
  check (kind in ('new','location','photos_same','photos_repainted','verify_location'));
