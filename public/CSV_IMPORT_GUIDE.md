# Student CSV Import Guide

## Overview
The bulk import feature allows administrators to import multiple students at once using a CSV (Comma-Separated Values) file. This is much faster than adding students one by one.

## CSV Format & Required Columns

### Required Fields (Must be present in every row):
- **name**: Full name of the student
- **email**: Unique email address for student login (must not already exist in system)
- **rollNumber**: Unique roll number (must not already exist in system)
- **classId**: MongoDB ID of the class the student belongs to
- **dateOfBirth**: Date of birth in YYYY-MM-DD format (e.g., 2008-05-15)
- **parentName**: Name of parent/guardian
- **phone**: Contact phone number

### Optional Fields:
- **address**: Student's residential address
- **parentEmail**: Email for creating parent login account
- **parentPassword**: Password for parent account (default: parent123)
- **password**: Password for student account (default: student123)

## Getting the Class ID

To find the MongoDB IDs for your classes:
1. Go to the "Classes" page in the administration panel
2. Each class displays its ID in the UI, or you can check the browser's developer console
3. Use these IDs in the `classId` column of your CSV file

## Creating Your CSV File

### Option 1: Download Sample Template
1. Go to Students → "Sample CSV" button
2. This downloads a pre-formatted CSV file you can edit in Excel, Google Sheets, or any text editor

### Option 2: Manual Creation
Create a CSV file with the following structure (comma-separated):

```
name,email,rollNumber,classId,dateOfBirth,parentName,phone,address,parentEmail,parentPassword,password
John Doe,john.doe@example.com,101,507f1f77bcf86cd799439011,2008-05-15,Robert Doe,+1234567890,123 Main St,parent.john@example.com,parent123,student123
Jane Smith,jane.smith@example.com,102,507f1f77bcf86cd799439011,2008-07-20,Sarah Smith,+1234567891,456 Oak Ave,parent.jane@example.com,parent123,student123
```

## Important Rules & Validation

### Data Validation:
- ✓ All dates must be in YYYY-MM-DD format
- ✓ Email addresses must be unique (no duplicates in system)
- ✓ Roll numbers must be unique (no duplicates in system)
- ✓ Class IDs must exist in the system
- ✓ Email format must be valid

### Errors Handling:
If there are errors during import:
- Successful records are saved
- Failed records show specific error messages
- You can fix the error and re-import the failed rows
- System prevents duplicate imports

### Default Passwords:
If you don't specify passwords in the CSV:
- Student password: `student123`
- Parent password: `parent123`

### Parent Accounts:
- If `parentEmail` is provided, a parent login account is automatically created
- The parent can then view their child's attendance, results, and grades
- Only provide `parentEmail` if you want to create parent accounts

## Step-by-Step Import Process

1. **Prepare Your CSV File**
   - Download the sample template or create your own
   - Fill in all required columns
   - Make sure class IDs are correct

2. **Go to Students Page**
   - Click "Students" in the left sidebar
   - Click "Import CSV" button

3. **Upload Your File**
   - Select your CSV file
   - Click "Import CSV" button

4. **Review Results**
   - Check the success message
   - If there are errors, fix those specific rows and try again

5. **Verify in System**
   - Refresh the Students page
   - Verify all imported students appear with correct information

## Tips & Best Practices

- **Test with small batch first**: Import 5-10 students first to verify the process
- **Keep a backup**: Always keep a copy of your CSV file
- **Use consistent formatting**: Excel can sometimes change date formats automatically
- **Check class IDs carefully**: One wrong class ID will fail that entire row
- **Batch processing**: You can import multiple batches throughout the year
- **Review before importing**: Double-check email addresses and roll numbers for duplicates

## Troubleshooting

### "Email already exists" error
**Solution**: The email address is already in use. Use a different email or remove the student and try again.

### "Roll number already exists" error
**Solution**: The roll number is already assigned. Use a unique roll number for this student.

### "Class not found" error
**Solution**: The classId doesn't exist. Verify the class exists and copy the correct ID from the Classes page.

### "Invalid date format" error
**Solution**: Use YYYY-MM-DD format for dates (e.g., 2008-05-15). Check your CSV file for correct date format.

### CSV file not accepted
**Solution**: 
- Make sure file extension is .csv
- File should be in UTF-8 encoding
- Don't include headers in extra quotes

## Example CSV Content

```
name,email,rollNumber,classId,dateOfBirth,parentName,phone,address,parentEmail,parentPassword,password
John Doe,john.doe@example.com,101,507f1f77bcf86cd799439011,2008-05-15,Robert Doe,+1234567890,123 Main St,parent.john@example.com,parent123,student123
Jane Smith,jane.smith@example.com,102,507f1f77bcf86cd799439011,2008-07-20,Sarah Smith,+1234567891,456 Oak Ave,parent.jane@example.com,parent123,student123
Mike Johnson,mike.johnson@example.com,103,507f1f77bcf86cd799439011,2008-03-10,David Johnson,+1234567892,789 Pine Rd,parent.mike@example.com,parent123,student123
Emily Brown,emily.brown@example.com,104,507f1f77bcf86cd799439011,2008-11-25,Patricia Brown,+1234567893,321 Elm St,parent.emily@example.com,parent123,student123
```

## Security Notes

- Passwords are hashed and never stored in plain text
- Default passwords should be changed by users on first login
- Only administrators can import students
- Import activities are logged in the system audit trail
