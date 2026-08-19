using { TravelService as service } from '../../srv/service';
using { Common } from '@sap/cds/common';

annotate service.ExpenseClaims with @(
  UI : {
    HeaderInfo : {
      $Type          : 'UI.HeaderInfoType',
      TypeName       : 'Expense Claim',
      TypeNamePlural : 'Expense Claims',
      Title          : { $Type: 'UI.DataField', Value: claimNumber },
      Description    : { $Type: 'UI.DataField', Value: tripPurpose }
    },
    SelectionFields : [
      claimNumber,
      status,
      employeeName,
      costCentre.code
    ],
    LineItem : [
      { $Type: 'UI.DataField', Value: claimNumber },
      { $Type: 'UI.DataField', Value: employeeName },
      { $Type: 'UI.DataField', Value: tripPurpose },
      { $Type: 'UI.DataField', Value: status },
      { $Type: 'UI.DataField', Value: totalAmount },
      { $Type: 'UI.DataField', Value: currency },
      { $Type: 'UI.DataField', Value: costCentre.code }
    ],
    Facets : [
      {
        $Type  : 'UI.ReferenceFacet',
        ID     : 'General',
        Label  : 'General Information',
        Target : '@UI.FieldGroup#General'
      },
      {
        $Type  : 'UI.ReferenceFacet',
        ID     : 'Commercial',
        Label  : 'Commercial',
        Target : '@UI.FieldGroup#Commercial'
      },
      {
        $Type  : 'UI.ReferenceFacet',
        ID     : 'itemsFacet',
        Label  : 'Items',
        Target : 'items/@UI.LineItem'
      }
    ],
    FieldGroup #General : {
      $Type : 'UI.FieldGroupType',
      Data  : [
        { $Type: 'UI.DataField', Value: claimNumber },
        { $Type: 'UI.DataField', Value: employeeName },
        { $Type: 'UI.DataField', Value: tripPurpose },
        { $Type: 'UI.DataField', Value: tripStart },
        { $Type: 'UI.DataField', Value: tripEnd },
        { $Type: 'UI.DataField', Value: status }
      ]
    },
    FieldGroup #Commercial : {
      $Type : 'UI.FieldGroupType',
      Data  : [
        { $Type: 'UI.DataField', Value: costCentre.code },
        { $Type: 'UI.DataField', Value: totalAmount },
        { $Type: 'UI.DataField', Value: currency }
      ]
    }
  }
);

annotate service.ExpenseClaims with {
  costCentre @(
    Common.Text : costCentre.name,
    Common.TextArrangement : #TextLast,
    Common.ValueList : {
      $Type : 'Common.ValueListType',
      CollectionPath : 'CostCentres',
      Label : 'Cost Centres',
      Parameters : [
        {
          $Type : 'Common.ValueListParameterInOut',
          LocalDataProperty : costCentre_ID,
          ValueListProperty : 'ID'
        },
        {
          $Type : 'Common.ValueListParameterDisplayOnly',
          ValueListProperty : 'code'
        },
        {
          $Type : 'Common.ValueListParameterDisplayOnly',
          ValueListProperty : 'name'
        },
        {
          $Type : 'Common.ValueListParameterDisplayOnly',
          ValueListProperty : 'companyCode'
        }
      ]
    }
  );
  status @Common.ValueListWithFixedValues : true;
};

annotate service.ExpenseItems with {
  category @Common.ValueListWithFixedValues : true;
};

annotate service.ExpenseItems with @(
  UI : {
    HeaderInfo : {
      $Type          : 'UI.HeaderInfoType',
      TypeName       : 'Expense Item',
      TypeNamePlural : 'Expense Items',
      Title          : { $Type: 'UI.DataField', Value: description },
      Description    : { $Type: 'UI.DataField', Value: category }
    },
    LineItem : [
      { $Type: 'UI.DataField', Value: position },
      { $Type: 'UI.DataField', Value: category },
      { $Type: 'UI.DataField', Value: expenseDate },
      { $Type: 'UI.DataField', Value: description },
      { $Type: 'UI.DataField', Value: amount },
      { $Type: 'UI.DataField', Value: currency }
    ]
  }
);
