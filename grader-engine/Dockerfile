# Sử dụng image linux gọn nhẹ
FROM ubuntu:20.04

#Cài đặt các công cụ cần thiết (trình biên dịch C++)
#-y : tự động đồng ý
#apt-get clean && rm -rf /var/lib/apt/lists/*: dọn dẹp image để gọn nhẹ hơn
RUN apt-get update && \
    apt-get install -y build-essential && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

#tạo 1 thư mục làm việc bên trong container
WORKDIR /sandbox

#Lệnh này được chạy khi container được khởi động (nêu không có lệnh nào khác được chỉ định)
#CMD ["/bin/bash"]