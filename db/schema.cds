namespace com.acme.travel;

using { cuid, managed } from '@sap/cds/common';

/**
 * Controlling cost centres
 */
@title: 'Cost Centre'
entity CostCentres : cuid, managed {
  @title: 'Cost Centre'
  code : String(10) not null;
  @title: 'Name'
  name : String(100);
  @title: 'Company Code'
  companyCode : String(4);
}

/**
 * Header of a travel expense claim
 */
@title: 'Expense Claim'
@assert.unique.claimNumber: [claimNumber]
entity ExpenseClaims : cuid, managed {
  @title: 'Claim Number'
  claimNumber : String(20) not null;
  @title: 'Employee'
  employeeName : String(80);
  @title: 'Trip Purpose'
  tripPurpose : String(120);
  @title: 'Trip Start'
  tripStart : Date;
  @title: 'Trip End'
  tripEnd : Date;
  @title: 'Status'
  status : String(20) enum {
    DRAFT     = 'DRAFT';
    SUBMITTED = 'SUBMITTED';
    APPROVED  = 'APPROVED';
    REJECTED  = 'REJECTED';
    PAID      = 'PAID';
  } default 'DRAFT';
  @title: 'Total Amount'
  totalAmount : Decimal(15, 2);
  @title: 'Currency'
  currency : String(3);
  @title: 'Cost Centre'
  costCentre : Association to CostCentres;
  @title: 'Items'
  items : Composition of many ExpenseItems on items.claim = $self;
}

@title: 'Expense Item'
entity ExpenseItems : cuid {
  @title: 'Position'
  position : Integer;
  @title: 'Category'
  category : String(20) enum {
    TRAVEL  = 'TRAVEL';
    MEAL    = 'MEAL';
    LODGING = 'LODGING';
    OTHER   = 'OTHER';
  };
  @title: 'Expense Date'
  expenseDate : Date;
  @title: 'Description'
  description : String(200);
  @title: 'Amount'
  amount : Decimal(15, 2);
  @title: 'Currency'
  currency : String(3);
  claim : Association to ExpenseClaims not null;
}
