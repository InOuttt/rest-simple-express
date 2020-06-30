CREATE TABLE sipd.SIPD_TRX_RPJPD (
	id uuid NOT NULL,
	no_rpjpd varchar(50) NULL,
	judul_rpjpd varchar(300) NULL,
	tgl_rpjpd date NULL,
	periode_awal varchar(10) NULL,
	periode_akhir varchar(10) NULL,
	status_rpjpd varchar(30) NULL,
	keterangan varchar(225) NULL,
	created_date timestamp NULL,
	created_by varchar(32) NULL,
	updated_date timestamp NULL,
	updated_by varchar(32) NULL,
	deleted_date timestamp NULL,
	status_aktif smallint NULL,
	SIPD_MST_KOTA_id varchar(20),
	SIPD_MST_PROVINSI_id varchar(20),
	SIPD_TRX_VISI_RPJPD_id varchar(36)
);
