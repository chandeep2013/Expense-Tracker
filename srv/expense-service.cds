using { my.expenses as db } from '../db/myexpenses';

@path: 'expenses'
@requires: 'authenticated-user'
service ExpenseService {
  entity Expenses as projection on db.Expenses;

  type ReportSlice : {
    category : String(20);
    total    : Decimal(15, 2);
    count    : Integer;
  }

  type ExpenseReport : {
    period     : String(10);
    anchor     : Date;
    fromDate   : Date;
    toDate     : Date;
    currency   : String(3);
    grandTotal : Decimal(15, 2);
    count      : Integer;
    slices     : many ReportSlice;
  }

  function getReport(period: String, anchor: Date) returns ExpenseReport;
  function loggedOn(day: Date) returns Boolean;
}
