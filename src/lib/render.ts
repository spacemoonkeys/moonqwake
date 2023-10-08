import * as THREE from 'three';

import quakes from '$lib/quakedata';

type Quake = {
	type: string;
	long: number;
	lat: number;
	date: number;
};

export function createScene(scene: THREE.Scene) {
	const skyboxTexture = new THREE.TextureLoader().load('/stars.jpg');
	const skyboxGeometry = new THREE.SphereGeometry(10);
	const skyboxMaterial = new THREE.MeshBasicMaterial({ map: skyboxTexture });
	const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
	skybox.material.side = THREE.DoubleSide;
	scene.add(skybox);

	const moonTexture = new THREE.TextureLoader().load(
		'/lroc_color_poles_4k.jpg'
	);

	const moonNormalMap = new THREE.TextureLoader().load('/ldem_16_uint.jpg');
	const moonGeometry = new THREE.SphereGeometry(1, 50, 50);
	const moonMaterial = new THREE.MeshStandardMaterial({
		map: moonTexture,
		normalMap: moonNormalMap,
		normalScale: new THREE.Vector2(4, 4),
	});
	moonMaterial.metalness = 0.1;
	moonMaterial.roughness = 0.5;
	const moon = new THREE.Mesh(moonGeometry, moonMaterial);
	scene.add(moon);

	const light = new THREE.DirectionalLight(0xffffff, 1.4);
	light.position.set(0, 0, 1);
	scene.add(light);

	const axesHelper = new THREE.AxesHelper(5000);
	moon.add(axesHelper);

	const dots = quakes.map((quake: Quake) => {
		const dotGeometry = new THREE.BufferGeometry();
		const pos = positionToCoordinates(quake.lat, quake.long, 1.03, 0);
		dotGeometry.setAttribute(
			'position',
			new THREE.BufferAttribute(new Float32Array([pos.x, pos.y, pos.z]), 3)
		);
		const dotMaterial = new THREE.PointsMaterial({
			size: 0.01,
			color: 0xffffff,
		});
		const dot = new THREE.Points(dotGeometry, dotMaterial);

		const mesh = text(quake.type, 0.05, 0.05, 100);
		mesh.position.set(pos.x, pos.y + 0.02, pos.z);
		dot.add(mesh);

		dot.add(mesh);
		moon.add(dot);

		return { mesh, dot };
	});

	return {
		light,
		moon,
		skybox,
		axesHelper,
		moonNormalMap,
		dots,
	};
}

function text(
	text: string,
	hWorldTxt: number,
	hWorldAll: number,
	hPxTxt: number
) {
	const kPxToWorld = hWorldTxt / hPxTxt;
	const hPxAll = Math.ceil(hWorldAll / kPxToWorld);

	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d')!;
	ctx.font = hPxTxt + 'px sans-serif';
	// now get the widths
	const wPxTxt = ctx.measureText(text).width;
	const wWorldTxt = wPxTxt * kPxToWorld;
	const wWorldAll = wWorldTxt + (hWorldAll - hWorldTxt);
	const wPxAll = Math.ceil(wWorldAll / kPxToWorld);

	canvas.width = wPxAll;
	canvas.height = hPxAll;

	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = hPxTxt + 'px sans-serif';
	ctx.lineWidth = hPxTxt / 50;
	// offset the line width to be outsid eof the text
	ctx.lineJoin = 'round';

	ctx.fillStyle = 'white';
	ctx.fillText(text, wPxAll / 2, hPxAll / 2);

	const texture = new THREE.Texture(canvas);
	texture.minFilter = THREE.LinearFilter;
	texture.needsUpdate = true;

	const geometry = new THREE.PlaneGeometry(wWorldAll, hWorldAll);
	const material = new THREE.MeshBasicMaterial({
		side: THREE.DoubleSide,
		map: texture,
		transparent: true,
		opacity: 1.0,
	});

	const mesh = new THREE.Mesh(geometry, material);

	mesh.wWorldTxt = wWorldTxt;
	mesh.wWorldAll = wWorldAll;
	mesh.wPxTxt = wPxTxt;

	mesh.wPxAll = wPxAll;
	mesh.hPxAll = hPxAll;
	mesh.ctx = ctx;

	return mesh;
}

function positionToCoordinates(
	lat: number,
	lon: number,
	rad: number,
	alt: number
) {
	const f = 0;
	const ls = Math.atan((1 - f) ** 2 * Math.tan(lat));

	const x =
		rad * Math.cos(ls) * Math.cos(lon) + alt * Math.cos(lat) * Math.cos(lon);
	const y =
		rad * Math.cos(ls) * Math.sin(lon) + alt * Math.cos(lat) * Math.sin(lon);
	const z = rad * Math.sin(ls) + alt * Math.sin(lat);

	return { x: x, y: y, z: z };
}
