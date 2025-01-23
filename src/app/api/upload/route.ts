import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/server/auth';
import { localStorage } from '@/lib/storage/local-storage';

export async function POST(req: NextRequest) {
	try {
		const session = await getServerAuthSession();
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const formData = await req.formData();
		const file = formData.get('file') as File;
		const uploadToken = formData.get('uploadToken') as string;

		if (!file || !uploadToken) {
			return NextResponse.json({ error: 'Missing file or upload token' }, { status: 400 });
		}

		const buffer = Buffer.from(await file.arrayBuffer());
		const filePath = await localStorage.saveFile(buffer, file.name, session.user.id);

		return NextResponse.json({ filePath });
	} catch (error) {
		console.error('Upload error:', error);
		return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest) {
	try {
		const session = await getServerAuthSession();
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { filePath } = await req.json();
		if (!filePath) {
			return NextResponse.json({ error: 'Missing file path' }, { status: 400 });
		}

		await localStorage.deleteFile(filePath);
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Delete error:', error);
		return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
	}
}