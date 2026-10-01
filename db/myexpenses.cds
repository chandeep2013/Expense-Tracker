namespace my.expenses;

using { cuid, managed } from '@sap/cds/common';

/**
 * Personal expense. `date` defaults to the local calendar day in the
 * service when the client omits it. Amounts are Indian rupees.
 */
@title: 'Expense'
entity Expenses : cuid, managed {
  @title: 'Date'
  date        : Date not null;
  @title: 'Category'
  category    : String(20) not null enum {
    FoodSnacks = 'Food/Snacks';
    Travel     = 'Travel';
    Groceries  = 'Groceries';
    UPI        = 'UPI';
  };
  @title: 'Amount'
  amount      : Decimal(15, 2) not null;
  @title: 'Currency'
  currency    : String(3) not null default 'INR';
  @title: 'Description'
  description : String(120);
  @title: 'User'
  user        : String(255) not null;
}
