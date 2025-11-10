<template>
  <el-card class="upload-card">
    <el-upload
      class="upload-demo"
      drag
      action=""
      :on-change="onFileChange"
      accept=".xlsx, .xls"
    >
      <i class="el-icon-upload"></i>
      <div class="el-upload__text">Drag the file here, or <em>click to upload</em></div>
      <div class="el-upload__tip" slot="tip">Only .xlsx and .xls files are accepted</div>
    </el-upload>
  </el-card>
</template>

<script setup>
import ExcelJS from 'exceljs';

const onFileChange = async (file) => {
  if (!file.raw) return;

  const workbook = new ExcelJS.Workbook();
  const reader = new FileReader();

  reader.onload = async function(e) {
    const arrayBuffer = e.target.result;
    await workbook.xlsx.load(arrayBuffer);
    const worksheet = workbook.getWorksheet(1);
    const jsonData = [];

    worksheet.eachRow((row, rowNumber) => {
      const rowValues = {};
      row.eachCell((cell, colNumber) => {
        rowValues[`Column${colNumber}`] = cell.value;
      });
      jsonData.push(rowValues);
    });

    console.log(jsonData);
  };

  reader.readAsArrayBuffer(file.raw);
};
</script>

<style scoped>
.upload-card {
  margin-top: 20px;
  padding: 16px;
  text-align: center;
}

.upload-demo {
  display: inline-block;
  width: 100%;
  max-width: 360px;
  margin: auto;
}
</style>