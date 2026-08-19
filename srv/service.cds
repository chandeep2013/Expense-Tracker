using { com.acme.travel as db } from '../db/schema';

service TravelService @(path: 'travel', requires: 'authenticated-user') {
  @odata.draft.enabled
  entity ExpenseClaims as projection on db.ExpenseClaims;
  entity ExpenseItems as projection on db.ExpenseItems;
  @readonly
  entity CostCentres as projection on db.CostCentres;
}
