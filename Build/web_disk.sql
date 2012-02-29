create table `hash_files`(
    `file` char(255) not null,
    `hashcode` char(255) not null,
    `user` char(255) not null,
    `size` int not null,
    PRIMARY KEY (`hashcode`)
)ENGINE=InnoDB DEFAULT CHARSET=utf8;

create table `allow_users`(
    `user` char(255) not null,
    PRIMARY KEY (`user`)
)ENGINE=InnoDB DEFAULT CHARSET=utf8;
